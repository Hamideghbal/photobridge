import java.nio.file.*;
import java.io.*;
import java.math.BigDecimal;
import java.util.*;
import com.google.gson.*;
import com.healthmarketscience.jackcess.*;

/** Creates a data-only Access snapshot: no attachments, macros or external links. */
public final class PhotoBridgeAccess {
  private static String displayName(JsonObject value,String key,String fallback) throws IOException {String name=value.has(key)?value.get(key).getAsString():fallback;if(name.length()==0||name.length()>64||!name.equals(name.trim())||name.matches(".*[.\\[\\]!\\x00-\\x1f].*"))throw new IOException("invalid_access_display_name");return name;}
  public static void main(String[] args) throws Exception {
    if(args.length==2 && args[0].equals("--inspect")) {
      try(Database db=new DatabaseBuilder(new File(args[1])).setReadOnly(true).open()) {
        JsonObject out=new JsonObject();
        for(String name:db.getTableNames())out.addProperty(name,db.getTable(name).getRowCount());
        System.out.println(out);
      } return;
    }
    if(args.length==3 && args[0].equals("--read")) {try(Database db=new DatabaseBuilder(new File(args[1])).setReadOnly(true).open()){List<Map<String,Object>> rows=new ArrayList<>();for(Row row:db.getTable(args[2].startsWith("b64:")?new String(Base64.getUrlDecoder().decode(args[2].substring(4)),java.nio.charset.StandardCharsets.UTF_8):args[2]))rows.add(new LinkedHashMap<>(row));System.out.println(new Gson().toJson(rows));}return;}
    if(args.length!=2)throw new IllegalArgumentException("input.json output.accdb required");
    Path output=Paths.get(args[1]);if(Files.exists(output))throw new IOException("output_exists");
    JsonObject model;try(Reader r=Files.newBufferedReader(Paths.get(args[0]),java.nio.charset.StandardCharsets.UTF_8)){model=JsonParser.parseReader(r).getAsJsonObject();}
    if(model.get("version").getAsInt()!=1)throw new IOException("invalid_export_version");
    try(Database db=DatabaseBuilder.create(Database.FileFormat.V2010,output.toFile())) {
      for(JsonElement element:model.getAsJsonArray("tables")) {
        JsonObject spec=element.getAsJsonObject();String name=spec.get("name").getAsString();
        if(!name.matches("[A-Za-z][A-Za-z0-9_]{0,50}"))throw new IOException("invalid_table_name");
        String display=displayName(spec,"title",name);TableBuilder builder=new TableBuilder(display);JsonArray columns=spec.getAsJsonArray("columns");
        for(JsonElement c:columns){JsonObject col=c.getAsJsonObject();String key=col.get("name").getAsString();if(!key.matches("[A-Za-z][A-Za-z0-9_]{0,50}"))throw new IOException("invalid_column_name");
          String field=displayName(col,"title",key);String type=col.get("type").getAsString();ColumnBuilder cb;
          switch(type){case "decimal":cb=new ColumnBuilder(field,DataType.NUMERIC).setPrecision(28).setScale(4);break;case "integer":cb=new ColumnBuilder(field,DataType.LONG);break;case "boolean":cb=new ColumnBuilder(field,DataType.BOOLEAN);break;case "memo":cb=new ColumnBuilder(field,DataType.MEMO);break;case "text":cb=new ColumnBuilder(field,DataType.TEXT).setLengthInUnits(255);break;default:throw new IOException("invalid_column_type");}
          builder.addColumn(cb);
        }
        Table table=builder.toTable(db);
        for(JsonElement item:spec.getAsJsonArray("rows")){JsonObject row=item.getAsJsonObject();Object[] values=new Object[columns.size()];for(int i=0;i<columns.size();i++){JsonObject col=columns.get(i).getAsJsonObject();JsonElement value=row.get(col.get("name").getAsString());if(value==null||value.isJsonNull()){values[i]=null;continue;}switch(col.get("type").getAsString()){case "decimal":values[i]=value.getAsBigDecimal();break;case "integer":values[i]=value.getAsInt();break;case "boolean":values[i]=value.getAsBoolean();break;default:values[i]=value.getAsString();}}
          table.addRow(values);
        }
      }
      db.flush();
    }
    try(Database db=new DatabaseBuilder(output.toFile()).setReadOnly(true).open()){
      JsonObject counts=new JsonObject();for(JsonElement element:model.getAsJsonArray("tables")){JsonObject spec=element.getAsJsonObject();String name=spec.get("name").getAsString();int expected=spec.getAsJsonArray("rows").size(),actual=db.getTable(displayName(spec,"title",name)).getRowCount();if(actual!=expected)throw new IOException("row_count_mismatch:"+name);counts.addProperty(name,actual);}System.out.println(counts);
    }
  }
}
